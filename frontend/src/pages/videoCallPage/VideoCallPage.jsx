import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import './VideoCallPage.scss';

const VideoCallRoom = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams(); // Get appointmentId from URL
  const role = localStorage.getItem('userRole'); // Get role from localStorage ('farmer' or 'expert')

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnection, setPeerConnection] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API);
    setSocket(newSocket);

    newSocket.emit('join-call', { appointmentId, role });

    // Listen for when the other user disconnects
    newSocket.on('user-disconnected', (data) => {
      console.log(`${data.role} has disconnected:`, data.message);
      alert(`The other user has left the call`);
      handleDisconnectCleanup();
    });

    return () => newSocket.disconnect();
  }, [appointmentId, role]);

  // Initialize media and peer connection
  useEffect(() => {
    const initializeCall = async () => {
      // Get user media first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Create peer connection
        const pc = createPeerConnection(stream);
        setPeerConnection(pc);

        // If farmer, create and send offer after peer connection is ready
        if (role === 'farmer') {
          setTimeout(() => makeOffer(pc), 1000); // Small delay to ensure connection is ready
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
      }
    };

    if (socket && !localStream) {
      initializeCall();
    }
  }, [socket, role]);

  // Set up socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    socket.on('video-call-offer', handleOffer);
    socket.on('video-call-answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('video-call-offer', handleOffer);
      socket.off('video-call-answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [socket, peerConnection, localStream]);

  const createPeerConnection = (stream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle incoming tracks (remote stream)
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          appointmentId,
          role,
        });
      }
    };

    // Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  };

  const makeOffer = async (pc) => {
    try {
      console.log('Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('video-call-offer', {
        offer,
        appointmentId,
        role: 'farmer',
      });
      console.log('Offer sent');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offerData) => {
    try {
      console.log('Received offer:', offerData);
      const { offer } = offerData;

      if (!peerConnection) {
        console.error('Peer connection not ready');
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('video-call-answer', {
        answer,
        appointmentId,
        role: 'expert',
      });
      console.log('Answer sent');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answerData) => {
    try {
      console.log('Received answer:', answerData);
      const { answer } = answerData;

      if (!peerConnection) {
        console.error('Peer connection not ready');
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Answer processed');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidateData) => {
    try {
      console.log('Received ICE candidate:', candidateData);
      const { candidate } = candidateData;

      if (!peerConnection) {
        console.error('Peer connection not ready for ICE candidate');
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = !track.enabled;
          setIsMuted(!isMuted);
        }
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          track.enabled = !track.enabled;
          setIsVideoOff(!isVideoOff);
        }
      });
    }
  };

  const handleDisconnectCleanup = () => {
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    // Stop all local media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Clear remote stream
    setRemoteStream(null);

    // Navigate back to the appropriate appointments page after a short delay
    setTimeout(() => {
      if (role === 'expert') {
        navigate('/appointment_requests');
      } else if (role === 'farmer') {
        navigate('/appointments');
      } else {
        navigate(-1);
      }
    }, 1000);
  };

  const disconnectCall = () => {
    // Emit disconnect event to server
    if (socket) {
      socket.emit('disconnect-call', { appointmentId, role });
    }

    // Perform cleanup
    handleDisconnectCleanup();
  };



  return (
    <div className="video-call-room">
      <h1>{role === 'farmer' ? 'Farmer' : 'Expert'} Video Call</h1>
      <div className="video-container">
        <div className="video-box">
          <video
            className="local-video"
            autoPlay
            playsInline
            muted={isMuted}
            ref={(ref) => {
              if (ref && localStream) {
                ref.srcObject = localStream;
              }
            }}
          />
        </div>
        <div className="video-box">
          <video
            className="remote-video"
            autoPlay
            playsInline
            ref={(ref) => {
              if (ref && remoteStream) {
                ref.srcObject = remoteStream;
              }
            }}
          />
        </div>
      </div>
      <div className="controls">
        <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button onClick={toggleVideo}>{isVideoOff ? 'Turn Video On' : 'Turn Video Off'}</button>
        <button onClick={disconnectCall}>Disconnect</button>
      </div>
    </div>
  );
};

export default VideoCallRoom;
