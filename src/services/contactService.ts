import type { ContactFormData } from '../interfaces';

export const contactService = {
  sendMessage: async (data: ContactFormData): Promise<{ success: boolean; message: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock - always succeed for demo
    console.log('Contact form submitted:', data);
    return { success: true, message: 'Message sent successfully' };
  }
};
