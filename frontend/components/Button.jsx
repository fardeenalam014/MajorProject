export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}
