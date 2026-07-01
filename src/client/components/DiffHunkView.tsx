interface Props {
  hunk: string | null;
}

export function DiffHunkView({ hunk }: Props) {
  if (!hunk) {
    return <div className="diff-hunk diff-hunk--empty">Line not found in current diff (may be outdated).</div>;
  }
  const lines = hunk.split('\n');
  return (
    <pre className="diff-hunk">
      {lines.map((line, i) => {
        const cls =
          line.startsWith('+') && !line.startsWith('+++') ? 'diff-line diff-line--add' :
          line.startsWith('-') && !line.startsWith('---') ? 'diff-line diff-line--del' :
          line.startsWith('@@') ? 'diff-line diff-line--hunk' :
          'diff-line';
        return <div key={i} className={cls}>{line}</div>;
      })}
    </pre>
  );
}
