import React, { useEffect, useRef } from 'react';


interface VideoCallProps {
   localStream: MediaStream | null;
   remoteStream: MediaStream | null;
   isIncoming: boolean;
   onAnswer: () => void;
   onEnd: () => void;
   status: string;
   partnerName: string;
}


export default function VideoCallModal({
   localStream, remoteStream, isIncoming, onAnswer, onEnd, status, partnerName
}: VideoCallProps) {
   const localVideoRef = useRef<HTMLVideoElement>(null);
   const remoteVideoRef = useRef<HTMLVideoElement>(null);


   useEffect(() => {
       if (localVideoRef.current && localStream) {
           localVideoRef.current.srcObject = localStream;
       }
   }, [localStream]);


   useEffect(() => {
       if (remoteVideoRef.current && remoteStream) {
           remoteVideoRef.current.srcObject = remoteStream;
       }
   }, [remoteStream]);


   return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
           <div className="relative w-full h-full md:w-[800px] md:h-[600px] bg-gray-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              
               <div className="absolute top-0 w-full p-4 z-10 bg-gradient-to-b from-black/70 to-transparent text-white text-center">
                   <h2 className="text-xl font-bold">{partnerName}</h2>
                   <p className="text-sm opacity-80">
                       {isIncoming ? "Đang gọi cho bạn..." : status === 'connected' ? "00:00" : "Đang kết nối..."}
                   </p>
               </div>


               <div className="flex-1 relative bg-black flex items-center justify-center">
                   {remoteStream ? (
                       <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                   ) : (
                       <div className="text-white flex flex-col items-center">
                           <div className="w-20 h-20 rounded-full bg-gray-700 animate-pulse mb-4"></div>
                           <p>Đang chờ video từ đối phương...</p>
                       </div>
                   )}


                   {localStream && (
                       <div className="absolute bottom-4 right-4 w-32 h-48 md:w-48 md:h-36 bg-gray-800 rounded-lg border-2 border-white/20 shadow-lg overflow-hidden">
                           <video
                               ref={localVideoRef}
                               autoPlay
                               playsInline
                               muted
                               className="w-full h-full object-cover transform scale-x-[-1]"
                           />
                       </div>
                   )}
               </div>


               <div className="absolute bottom-8 w-full flex justify-center items-center gap-8 z-20">
                   {isIncoming ? (
                       <>
                           <button
                               onClick={onAnswer}
                               className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg animate-bounce"
                           >
                               📞
                           </button>
                           <button
                               onClick={onEnd}
                               className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                           >
                               ❌
                           </button>
                       </>
                   ) : (
                       <button
                           onClick={onEnd}
                           className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg flex items-center gap-2"
                       >
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                           </svg>
                           Kết thúc
                       </button>
                   )}
               </div>
           </div>
       </div>
   );
}
