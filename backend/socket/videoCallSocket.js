import Appointment from "../models/appointmentModel.js";
import ExpertDetails from "../models/expertDetail.model.js";

const videoCallSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle the join-call event
    socket.on('join-call', async ({ appointmentId, role }) => {
      console.log(`User with role ${role} is joining call for appointment ${appointmentId}`);

      socket.appointmentId = appointmentId;
      socket.role = role;

      // Join the socket room first
      socket.join(appointmentId);

      console.log(`${role} joined room ${appointmentId}`);
    });

    // Handle the video call offer (from farmer to expert)
    socket.on('video-call-offer', (offerData) => {
      const { appointmentId, offer, role } = offerData;
      console.log(`Received offer from ${role} for appointment ${appointmentId}`);

      // Send the offer to the other user in the room (not to sender)
      socket.to(appointmentId).emit('video-call-offer', {
        offer,
        appointmentId,
        role,
      });
    });

    // Handle the video call answer (from expert to farmer)
    socket.on('video-call-answer', (answerData) => {
      const { appointmentId, answer, role } = answerData;
      console.log(`Received answer from ${role} for appointment ${appointmentId}`);

      // Send the answer to the other user in the room (not to sender)
      socket.to(appointmentId).emit('video-call-answer', {
        answer,
        appointmentId,
        role,
      });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (candidateData) => {
      const { appointmentId, candidate, role } = candidateData;
      console.log(`Received ICE candidate from ${role} for appointment ${appointmentId}`);

      // Send the ICE candidate to the other user in the room (not to sender)
      socket.to(appointmentId).emit('ice-candidate', {
        candidate,
        appointmentId,
        role,
      });
    });

    const handleDisconnect = async (appointmentId, role) => {
      console.log(`Handling disconnect for role ${role} on appointment ${appointmentId}`);

      // Notify the other user in the call
      socket.to(appointmentId).emit('user-disconnected', {
        role,
        message: `${role} has left the call`,
      });

      // Update appointment status to completed and increment expert performance stats in the database
      try {
        const appointment = await Appointment.findById(appointmentId);
        if (appointment && appointment.status !== 'completed') {
          appointment.status = 'completed';
          await appointment.save();
          console.log(`Appointment ${appointmentId} status updated to completed`);

          // Increment successful appointments and other stats for the expert
          const expertId = appointment.expertId;
          await ExpertDetails.findOneAndUpdate(
            { userId: expertId },
            {
              $inc: {
                'expertStats.successfulAppointments': 1,
                'expertStats.farmersHelped': 1,
                'appointmentStats.totalAppointments': 1
              }
            },
            { upsert: true, new: true }
          );
          console.log(`Expert stats updated for expert ${expertId}`);
        }
      } catch (err) {
        console.error(`Failed to update appointment or expert stats for ${appointmentId}:`, err);
      }
    };

    // Handle manual disconnect-call event (when user clicks disconnect button)
    socket.on('disconnect-call', async ({ appointmentId, role }) => {
      await handleDisconnect(appointmentId, role);
      socket.appointmentId = null;
      socket.role = null;
      // Leave the socket room
      socket.leave(appointmentId);
    });

    // Handle automatic disconnect event (when connection is lost)
    socket.on('disconnect', async () => {
      console.log('User disconnected');
      if (socket.appointmentId && socket.role) {
        await handleDisconnect(socket.appointmentId, socket.role);
        socket.appointmentId = null;
        socket.role = null;
      }
    });
  });
};

export default videoCallSocket;
