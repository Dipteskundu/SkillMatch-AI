/**
 * Validates and uploads an image file to ImgBB.
 * @param {File} file - The image file to upload.
 * @returns {Promise<{url: string|null, error: string|null}>} - The URL of the uploaded image and any error message.
 */
export const uploadToImgBB = async (file) => {
    if (!file) return { url: null, error: "No file provided" };

    // Validation: Type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
        return { url: null, error: "Invalid file type. Please upload a JPG, PNG, or WEBP image." };
    }

    // Validation: Size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { url: null, error: "File too large. Maximum size is 5MB." };
    }

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
        // output removed
        return { url: null, error: "System configuration error." };
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            return { url: result.data.url, error: null };
        } else {
            // output removed
            return { url: null, error: result.error?.message || "Failed to upload image to ImgBB." };
        }
    } catch (error) {
        // output removed
        return { url: null, error: "Network error occurred while uploading. Please try again." };
    }
};

