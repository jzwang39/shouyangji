import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const execFile = promisify(execFileCallback);
const WORD_FILE_EXTENSIONS = new Set(["doc", "docx"]);
const OUTLINE_EXTRACTION_MAX_FILES = 60;

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0) return "";
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function normalizeWordTextContent(text: string) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let tempDirectory = "";

  try {
    const formData = await request.formData();
    const separatorTemplate = String(formData.get("separator") ?? "").trim();
    const normalizedSeparator = separatorTemplate || "** 第x节 **";
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return new NextResponse("请先上传至少 1 个 Word 文件", { status: 400 });
    }
    if (files.length > OUTLINE_EXTRACTION_MAX_FILES) {
      return new NextResponse(
        `当前最多支持上传 ${OUTLINE_EXTRACTION_MAX_FILES} 个 Word 文件`,
        { status: 400 }
      );
    }

    const invalidFiles = files.filter((file) => {
      const extension = getFileExtension(file.name);
      return !WORD_FILE_EXTENSIONS.has(extension);
    });
    if (invalidFiles.length > 0) {
      return new NextResponse("目前仅支持上传 Word 类型文件（.doc、.docx）", {
        status: 400
      });
    }

    tempDirectory = await mkdtemp(path.join(tmpdir(), "outline-extraction-"));

    const sections: string[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = getFileExtension(file.name);
      const tempFilePath = path.join(tempDirectory, `file-${index + 1}.${extension}`);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(tempFilePath, Buffer.from(arrayBuffer));

      const { stdout } = await execFile(
        "/usr/bin/textutil",
        ["-convert", "txt", "-stdout", "-encoding", "UTF-8", tempFilePath],
        {
          maxBuffer: 50 * 1024 * 1024
        }
      );

      const separator = normalizedSeparator.replace(/x/g, String(index + 1));
      const content = normalizeWordTextContent(stdout);
      sections.push(`${separator}\n${content || "（该文稿未解析到可用正文内容）"}`);
    }

    return NextResponse.json({
      mergedText: sections.join("\n\n")
    });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message.trim()
        ? e.message.trim()
        : "文件合并失败，请检查 Word 文档是否损坏后重试";
    return new NextResponse(message, { status: 500 });
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }
}
