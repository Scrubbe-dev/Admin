import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const vonageConfig = {
  apiKey: process.env.VONAGE_API_KEY!,
  apiSecret: process.env.VONAGE_API_SECRET!,
};

const vonageAxios = axios.create({
  baseURL: "https://rest.nexmo.com",
  params: {
    api_key: vonageConfig.apiKey,
    api_secret: vonageConfig.apiSecret,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

export default vonageAxios;
