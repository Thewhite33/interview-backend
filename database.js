// In-memory candidate responses
const responses = [];

function saveResponse(candidateEmail, slot) {
    responses.push({ candidateEmail, slot, timestamp: new Date() });
    console.log("✅ Saved response:", { candidateEmail, slot });
}

function getResponses() {
    return responses;
}

module.exports = { saveResponse, getResponses };
