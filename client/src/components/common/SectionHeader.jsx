export default function SectionHeader({ number, title }) {
  return (
    <div className="bg-chrome-section text-white text-sm font-semibold uppercase tracking-wider px-4 py-2.5 rounded-t">
      {number}. {title}
    </div>
  );
} 