"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const toolbarButtonClass =
  "p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgb(255_255_255_/8%)] transition-colors";

const activeButtonClass =
  "text-[var(--color-electric-purple)] bg-[rgb(123_63_242_/12%)]";

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="w-full rounded-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] min-h-[200px]">
        加载中...
      </div>
    );
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-2 py-1.5">
        <button
          type="button"
          onClick={toggleBold}
          className={`${toolbarButtonClass} ${isActive("bold") ? activeButtonClass : ""}`}
          title="粗体"
          data-testid="tiptap-bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={`${toolbarButtonClass} ${isActive("italic") ? activeButtonClass : ""}`}
          title="斜体"
          data-testid="tiptap-italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-[rgb(255_255_255_/10%)]" />
        <button
          type="button"
          onClick={toggleH1}
          className={`${toolbarButtonClass} ${isActive("heading", { level: 1 }) ? activeButtonClass : ""}`}
          title="一级标题"
          data-testid="tiptap-h1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleH2}
          className={`${toolbarButtonClass} ${isActive("heading", { level: 2 }) ? activeButtonClass : ""}`}
          title="二级标题"
          data-testid="tiptap-h2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-[rgb(255_255_255_/10%)]" />
        <button
          type="button"
          onClick={toggleBulletList}
          className={`${toolbarButtonClass} ${isActive("bulletList") ? activeButtonClass : ""}`}
          title="无序列表"
          data-testid="tiptap-bullet-list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={`${toolbarButtonClass} ${isActive("orderedList") ? activeButtonClass : ""}`}
          title="有序列表"
          data-testid="tiptap-ordered-list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-[rgb(255_255_255_/10%)]" />
        <button
          type="button"
          onClick={toggleLink}
          className={`${toolbarButtonClass} ${isActive("link") ? activeButtonClass : ""}`}
          title="链接"
          data-testid="tiptap-link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="w-full rounded-b-lg border border-[rgb(212_218_245_/12%)] bg-[rgb(255_255_255_/5%)] px-3 py-2 text-sm text-[var(--color-text-primary)] min-h-[200px] focus-within:border-[var(--color-electric-purple)] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_p]:my-1 [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:my-2 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_a]:text-[var(--color-electric-purple)] [&_.ProseMirror_a]:underline [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic"
      />
    </div>
  );
}
