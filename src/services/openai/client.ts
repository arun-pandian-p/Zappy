import { supabase } from "@/integrations/supabase/client";

export class OpenAIClient {
  static async getApiKey(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('get-secret', {
      body: { secretName: 'OPENAI_API_KEY' }
    });
    
    if (error || !data?.secret) {
      throw new Error("Failed to retrieve OpenAI API Key");
    }
    
    return data.secret;
  }
}
