import { removeBackground, loadImage } from './backgroundRemover';

export const processLogoBackground = async (): Promise<void> => {
  try {
    // Load the current logo
    const response = await fetch('/src/assets/inminds-logo-enhanced.png');
    const blob = await response.blob();
    
    // Load image element
    const imageElement = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(imageElement);
    
    // Create download URL and save
    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inminds-logo-transparent.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Logo background removed successfully');
  } catch (error) {
    console.error('Error processing logo:', error);
  }
};