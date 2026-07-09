import { useDragScroll } from '../hooks/useDragScroll';

interface Props {
  hunk: string | null;
  className?: string;
}

export function DiffHunkView({ hunk, className }: Props) {
  const scrollRef = useDragScroll<HTMLPreElement>();
  const cls = className ? `diff-hunk ${className}` : 'diff-hunk';
  if (!hunk) {
    return <div className={`${cls} diff-hunk--empty`}>Line not found in current diff (may be outdated).</div>;
  }
  const lines = hunk.split('\n');
  return (
    <pre className={cls} ref={scrollRef}>
      {lines.map((line, i) => {
        const lineCls =
          line.startsWith('+') && !line.startsWith('+++') ? 'diff-line diff-line--add' :
          line.startsWith('-') && !line.startsWith('---') ? 'diff-line diff-line--del' :
          line.startsWith('@@') ? 'diff-line diff-line--hunk' :
          'diff-line';
        return <div key={i} className={lineCls}>{line}</div>;
      })}
    </pre>
  );
}
