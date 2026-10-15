import { baseApi } from "./baseApi";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  suggestions: string[];
  via: "ai" | "faq";
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** One turn with the shopping assistant. Send the whole conversation so far, oldest first. */
    sendChat: b.mutation<ChatReply, { messages: ChatTurn[]; path: string }>({
      query: (body) => ({ url: "/chat", method: "POST", body }),
    }),
  }),
});

export const { useSendChatMutation } = chatApi;
