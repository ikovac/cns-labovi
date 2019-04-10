const axios = require("axios");

const URL = "http://localhost:3000";


async function getChallenge() {
  let response;

  try {
    response = await axios.get(`${URL}/ctr/challenge`);
    return response.data;
  } catch (err) {
    console.log("Error in function getChallenge(): " + err);
  }
}


async function sendRequest(plaintext) {
  let response;

  try {
    response = await axios.post(`${URL}/ctr`, { plaintext: plaintext });
    return response.data;
  } catch (err) {
    console.log("Error in function sendRequest(): " + err);
  }
}


function XOR(ciphertext, keystream) {
  const ciphertextBuffer = Buffer.from(ciphertext, "hex");
  const keystreamBuffer = Buffer.from(keystream, "hex");

  let bufferResult = Buffer.alloc(ciphertextBuffer.length);
  for (let i = 0; i < bufferResult.length; i++) {
    bufferResult[i] = ciphertextBuffer[i] ^ keystreamBuffer[i];
  }

  return bufferResult.toString();
}


async function main() {
  let i = 0;
  let plaintext = '';
  const { ciphertext: chCipher } = await getChallenge();
  [...chCipher].forEach(val => {
    plaintext += '0';
  });
  let found = 0;
  while (!found) {
    let { ciphertext: keystream } = await sendRequest(plaintext);
    let chPlaintext = XOR(chCipher, keystream);
    if(chPlaintext.includes('Chuck') && chPlaintext.includes('Norris')) {
        found = true;
        return chPlaintext;
    }
  }
}

main().then(vic => console.log(vic));
