import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useAppSelector } from './reduxHooks';


const ICE_SERVERS = {
   iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:global.stun.twilio.com:3478' }
   ],
};


export const useWebRTC = (currentPartner: string) => {
   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
   const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
   const [isCalling, setIsCalling] = useState(false);
   const [isIncoming, setIsIncoming] = useState(false);
   const [callStatus, setCallStatus] = useState<string>('');


   const peerConnection = useRef<RTCPeerConnection | null>(null);
   const { user } = useAppSelector(state => state.auth);
   const chatType = useAppSelector(state => state.currentChat.type) || 'people';

   const candidateQueue = useRef<RTCIceCandidate[]>([]);
   const sendingTimeout = useRef<NodeJS.Timeout | null>(null);


   const createPeerConnection = useCallback(() => {
       if (peerConnection.current) return peerConnection.current;


       const pc = new RTCPeerConnection(ICE_SERVERS);


       pc.onicecandidate = (event) => {
           if (event.candidate) {
            candidateQueue.current.push(event.candidate);
            if (sendingTimeout.current) clearTimeout(sendingTimeout.current);
            sendingTimeout.current = setTimeout(() => {
                if (candidateQueue.current.length > 0) {
                    candidateQueue.current.forEach(cand => {
                        socketService.sendWebRTCSignal(currentPartner, {
                            type: 'CANDIDATE',
                            candidate: cand
                        }, chatType);
                    });
                    candidateQueue.current = []; 
                }
            }, 100);
           }
       };


       pc.ontrack = (event) => {
           console.log("Nhận remote stream");
           setRemoteStream(event.streams[0]);
       };
      
       pc.onconnectionstatechange = () => {
            switch(pc.connectionState) {
                case 'connected': setCallStatus('connected'); break;
                case 'disconnected':
                case 'failed':
                case 'closed':
                   endCall();
                   break;
            }
       };


       peerConnection.current = pc;
       return pc;
   }, [currentPartner,chatType]);


   // 2. Lắng nghe tín hiệu từ SocketService
   useEffect(() => {
       socketService.registerWebRTCListener(async (sender, payload) => {
           // Chỉ nhận tín hiệu từ người đang chat cùng
           if (sender !== currentPartner) return;


           if (!peerConnection.current && payload.type !== 'OFFER') return;


           const pc = peerConnection.current || createPeerConnection();


           switch (payload.type) {
               case 'OFFER':
                   setIsIncoming(true);
                   setCallStatus('incoming');
                   // Lưu offer vào remote description tạm thời (hoặc xử lý sau khi bấm nghe)
                   await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                   break;


               case 'ANSWER':
                   await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                   break;


               case 'CANDIDATE':
                   try {
                       if (payload.candidate) {
                           await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                       }
                   } catch (e) {
                       console.error("Lỗi add ICE:", e);
                   }
                   break;
              
               case 'END_CALL':
                   endCall();
                   break;
           }
       });


       return () => {
       };
   }, [currentPartner, createPeerConnection]);




   const startLocalStream = async () => {
       try {
           const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
           setLocalStream(stream);
           return stream;
       } catch (err) {
           console.error("Không thể lấy camera:", err);
           alert("Vui lòng cấp quyền Camera/Micro để gọi video!");
           return null;
       }
   };


   const startCall = async () => {
       const stream = await startLocalStream();
       if (!stream) return;


       setIsCalling(true);
       setCallStatus('calling');


       const pc = createPeerConnection();
       // Add tracks
       stream.getTracks().forEach(track => pc.addTrack(track, stream));


       // Tạo Offer
       const offer = await pc.createOffer();
       await pc.setLocalDescription(offer);


       // Gửi Offer
       socketService.sendWebRTCSignal(currentPartner, {
           type: 'OFFER',
           offer: offer
       },chatType);
   };


   const answerCall = async () => {
       const stream = await startLocalStream();
       if (!stream) return;


       setIsIncoming(false);
       setIsCalling(true);
       setCallStatus('connected');


       const pc = peerConnection.current;
       if (!pc) return;


       // Add tracks
       stream.getTracks().forEach(track => pc.addTrack(track, stream));


       // Tạo Answer
       const answer = await pc.createAnswer();
       await pc.setLocalDescription(answer);


       // Gửi Answer
       socketService.sendWebRTCSignal(currentPartner, {
           type: 'ANSWER',
           answer: answer
       },chatType);
   };


   const endCall = () => {
       localStream?.getTracks().forEach(track => track.stop());
      
       if (peerConnection.current) {
           peerConnection.current.close();
           peerConnection.current = null;
       }


       setLocalStream(null);
       setRemoteStream(null);
       setIsCalling(false);
       setIsIncoming(false);
       setCallStatus('');


       // Gửi tín hiệu kết thúc cho bên kia
       socketService.sendWebRTCSignal(currentPartner, { type: 'END_CALL' },chatType);
   };


   return {
       localStream,
       remoteStream,
       isCalling,
       isIncoming,
       callStatus,
       startCall,
       answerCall,
       endCall
   };
};
