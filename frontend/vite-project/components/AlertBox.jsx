import { motion, AnimatePresence } from "framer-motion";

export default function AlertBox({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
