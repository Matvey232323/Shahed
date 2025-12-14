import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import Peer from 'simple-peer';

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const VideoContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 800px;
  margin-bottom: 2rem;
`;

const Video = styled.video`
  width: 45%;
  border-radius: 10px;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
`;

const ControlButton = styled.button`
  background: ${props => props.danger ? '#ff4444' : '#444'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
`;

interface Call {
  type: 'voice' | 'video';
  chatId: string;
}

interface CallWindowProps {
  call: Call;
  onEnd: () => void;
}

const CallWindow: React.FC<CallWindowProps> = ({ call, onEnd }) => {
  const userVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance>();

  useEffect(() => {
    // Initialize WebRTC
    navigator.mediaDevices.getUserMedia({ video: call.type === 'video', audio: true })
      .then(stream => {
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        // Create peer connection
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream
        });

        peerRef.current = peer;

        peer.on('signal', data => {
          // Send signal to server
          console.log('Signal:', data);
        });

        peer.on('stream', partnerStream => {
          if (partnerVideo.current) {
            partnerVideo.current.srcObject = partnerStream;
          }
        });
      });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [call]);

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    onEnd();
  };

  return (
    <Container>
      <VideoContainer>
        <Video ref={userVideo} autoPlay muted />
        <Video ref={partnerVideo} autoPlay />
      </VideoContainer>
      <Controls>
        <ControlButton>
          <FaMicrophone />
        </ControlButton>
        <ControlButton danger onClick={endCall}>
          <FaPhone />
        </ControlButton>
        {call.type === 'video' && (
          <ControlButton>
            <FaVideo />
          </ControlButton>
        )}
      </Controls>
    </Container>
  );
};

export default CallWindow;