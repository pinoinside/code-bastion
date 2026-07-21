function encryptData(data, password) {
    return CryptoJS.AES.encrypt(data, password).toString();
}

function decryptData(data, password) {
    const bytes = CryptoJS.AES.decrypt(data, password);

    return bytes.toString(CryptoJS.enc.Utf8);
}
