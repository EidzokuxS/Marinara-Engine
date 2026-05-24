export type MariMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type MariAttachment = {
  id?: string;
  name: string;
  type: string;
  size: number;
  content: string;
};

export type MariPersonaContext = {
  id?: string | null;
  name?: string | null;
  comment?: string | null;
  description?: string | null;
  personality?: string | null;
  scenario?: string | null;
  backstory?: string | null;
  appearance?: string | null;
};

export type MariEntryRequest = {
  userMessage: string;
  messages: MariMessage[];
  connectionId?: string | null;
  persona?: MariPersonaContext | null;
  attachments?: MariAttachment[];
};

export type MariEntryResponse = {
  content: string;
  createdAt: string;
};

export type MariGateway = {
  prompt(input: MariEntryRequest): Promise<MariEntryResponse>;
};

export async function runProfessorMariEntry(input: MariEntryRequest, gateway: MariGateway): Promise<MariEntryResponse> {
  return gateway.prompt({
    ...input,
    userMessage: input.userMessage.trim(),
    messages: input.messages.slice(),
    attachments: input.attachments ?? [],
    connectionId: input.connectionId ?? null,
    persona: input.persona ?? null,
  });
}
