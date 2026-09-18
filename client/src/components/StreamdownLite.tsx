/**
 * Lightweight Streamdown replacement using react-markdown.
 * Drops shiki (328 language grammars, 8.4MB) in favor of simple markdown rendering.
 * This is all a financial advisor platform needs.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StreamdownProps {
  children?: string;
  content?: string;
  className?: string;
  [key: string]: unknown;
}

export function Streamdown({ children, content, className, ...props }: StreamdownProps) {
  const text = children || content || "";
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style code blocks without shiki
          code({ className: codeClassName, children: codeChildren, ...rest }) {
            const isInline = !codeClassName;
            return isInline ? (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
                {codeChildren}
              </code>
            ) : (
              <code className={`block bg-black/30 p-4 rounded-lg text-sm font-mono overflow-x-auto ${codeClassName || ""}`} {...rest}>
                {codeChildren}
              </code>
            );
          },
          // Style tables
          table({ children: tableChildren }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-white/20">
                  {tableChildren}
                </table>
              </div>
            );
          },
          th({ children: thChildren }) {
            return (
              <th className="border border-white/20 bg-white/5 px-4 py-2 text-left font-semibold">
                {thChildren}
              </th>
            );
          },
          td({ children: tdChildren }) {
            return (
              <td className="border border-white/20 px-4 py-2">
                {tdChildren}
              </td>
            );
          },
          // Style headings
          h1({ children: h1Children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-3">{h1Children}</h1>;
          },
          h2({ children: h2Children }) {
            return <h2 className="text-xl font-bold mt-5 mb-2">{h2Children}</h2>;
          },
          h3({ children: h3Children }) {
            return <h3 className="text-lg font-semibold mt-4 mb-2">{h3Children}</h3>;
          },
          // Style lists
          ul({ children: ulChildren }) {
            return <ul className="list-disc pl-6 my-2 space-y-1">{ulChildren}</ul>;
          },
          ol({ children: olChildren }) {
            return <ol className="list-decimal pl-6 my-2 space-y-1">{olChildren}</ol>;
          },
          // Style paragraphs
          p({ children: pChildren }) {
            return <p className="my-2 leading-relaxed">{pChildren}</p>;
          },
          // Style blockquotes
          blockquote({ children: bqChildren }) {
            return (
              <blockquote className="border-l-4 border-emerald-500/50 pl-4 my-3 italic opacity-90">
                {bqChildren}
              </blockquote>
            );
          },
          // Style links
          a({ href, children: aChildren }) {
            return (
              <a href={href} className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer">
                {aChildren}
              </a>
            );
          },
          // Style strong/bold
          strong({ children: strongChildren }) {
            return <strong className="font-bold text-white">{strongChildren}</strong>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default Streamdown;
