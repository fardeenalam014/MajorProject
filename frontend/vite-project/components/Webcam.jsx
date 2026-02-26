import { useEffect, useRef } from "react";

export default function Webcam({ videoRef }) {

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      });
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      width="500"
      style={{ border: "2px solid black" }}
    />
  );
}
