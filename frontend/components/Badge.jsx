export default function Badge({ children }) {
  return (
    <span className="bg-red-600 text-white px-3 py-1 rounded-xl text-sm font-semibold">
      {children}
    </span>
  );
}
