const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const incrementIv = require('../../CNS-2018-19/crypto-oracle/utils/increment-bigint');

// Constants
const wordListPath = "../../CNS-2018-19/crypto-oracle/public/wordlist.txt";
const URL = "http://localhost:3000";
let starterIvBuffer = Buffer.from('8f75a012904365c75fa36330ccd1510e', 'hex');

/**
 * @returns object {iv, ciphertext}
 */
async function getChallenge() {
  let response;

  try {
    response = await axios.get(`${URL}/cbc/iv/challenge`);
    return response.data;
  } catch (err) {
    console.log("Error in function getChallenge(): " + err);
  }
}

/**
 *
 * @param plaintext
 * @returns object {iv, ciphertext}
 */
async function sendRequest(plaintext) {
  let response;

  try {
    response = await axios.post(`${URL}/cbc/iv`, { plaintext: plaintext });
    return response.data;
  } catch (err) {
    console.log("Error in function sendRequest(): " + err);
  }
}

/**
 *
 * @param plaintext
 * @returns hex value of plaintext + padding
 */
function addPadding(plaintext) {
  if (plaintext.length > 16) {
    throw new Error("PlainText if longer than 16 B");
  }

  let sourceBuffer = Buffer.from(plaintext);
  let pad = 16 - plaintext.length;
  let targetBuffer = pad > 0 ? Buffer.alloc(16, pad) : Buffer.alloc(32, 16);
  sourceBuffer.copy(targetBuffer, 0, 0);

  return targetBuffer.toString("hex");
}

/**
 * 
 * @param plaintext 
 * @param ivNext 
 * @param iv0 
 * @returns hex value of result
 */
function XOR(plaintext, ivNext, iv0) {
  const plaintextBuffer = Buffer.from(plaintext, "hex");
  const ivNextBuffer = Buffer.from(ivNext, "hex");
  const iv0Buffer = Buffer.from(iv0, "hex");

  let bufferResult = Buffer.alloc(16);
  for (let i = 0; i < bufferResult.length; i++) {
    bufferResult[i] = plaintextBuffer[i] ^ ivNextBuffer[i] ^ iv0Buffer[i];
  }

  return bufferResult.toString("hex");
}

/**
 * path to wordlist file and object {iv, ciphertext}
 * @param filePath 
 * @param challengeData 
 * 
 * console logging Result word.
 */
function findChallengeWord(filePath, challengeData) {
  let readFile = readline.createInterface({
    input: fs.createReadStream(filePath)
  });

  const {iv: iv0, ciphertext} = challengeData;
  console.log("IV0: " + iv0);
  console.log("ciphertext: " + ciphertext);

  readFile.on("line", async data => {
      let wordPadded = addPadding(data);
      incrementIv(starterIvBuffer, 4);
      let ivNext = starterIvBuffer.toString('hex');
      let plaintext = XOR(wordPadded, ivNext, iv0);

      let response = await sendRequest(plaintext);
      if(response.ciphertext.substring(0, 32) == ciphertext) {
          console.log("Word is: " + data);
      }
    });
}

getChallenge().then(data => {
    findChallengeWord(wordListPath, data);
});

// sendRequest('test').then(data => console.log(data));