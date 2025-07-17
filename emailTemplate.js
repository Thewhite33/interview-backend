const generateInterviewEmail = (candidateName, candidateEmail, slots, baseUrl, date) => {
  const acceptLinks = slots.map(slot => {
    return `<li><a href="${baseUrl}/accept?email=${encodeURIComponent(candidateEmail)}&slot=${encodeURIComponent(slot)}&date=${encodeURIComponent(date)}">${slot}</a></li>`;
  }).join('');

  const declineLink = `${baseUrl}/select-slot?email=${encodeURIComponent(candidateEmail)}&date=${encodeURIComponent(date)}`;

  return `
    <p>Hi ${candidateName},</p>
    <p>Your interview is scheduled for <strong>${date}</strong>.</p>
    <p>Please choose your preferred interview time:</p>
    <ul>${acceptLinks}</ul>
    <p>❌ None of these work? <a href="${declineLink}">Choose a custom time here</a>.</p>
    <p>Thanks,<br>Recruitment Team</p>
  `;
};

module.exports = { generateInterviewEmail };
