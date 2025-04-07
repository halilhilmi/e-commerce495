import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS, TOTP_SECRET_KEY } from "../config/config";
import { TOTP } from "totp-generator";

export const checkPassword = async (
    candidatePassword: string,
    userPassword: string
): Promise<boolean> => {
    return bcrypt.compare(candidatePassword, userPassword);
};

export const encryptPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const validateIdNumber = (idNumber: string): boolean => {
    // ID numarasının uzunluğu 11 karakter olmalı
    if (idNumber.length !== 11) {
        return false;
    }

    // ID numarası sadece rakamlardan oluşmalı
    if (!/^\d{11}$/.test(idNumber)) {
        return false;
    }

    const digits = idNumber.split('').map(Number);

    // Son rakam çift sayı olmalı
    if (digits[10] % 2 !== 0) {
        return false;
    }

    // İlk 10 rakamın toplamının birler basamağı son rakamı vermeli
    const sumOfFirstTen = digits.slice(0, 10).reduce((acc, digit) => acc + digit, 0);
    if (sumOfFirstTen % 10 !== digits[10]) {
        return false;
    }

    return true;
};

export const validatePassword = (password: string): boolean => {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,1024}$/;
    return regex.test(password);
};

export const checkObject = (data: any[]): boolean => {
    return data?.length > 0;
};

export const checkParam = (data: any): boolean => {
    return data === undefined || data === null || data === "";
};

export const checkParams = (params: object): string[] => {
    const missing = [];
    for (const [key, value] of Object.entries(params)) {
        if (checkParam(value)) {
            missing.push(key);
        }
    }
    return missing;
};

export const generateOtp = (digits: number): string => {
    const { otp }: { otp: string } = TOTP.generate(TOTP_SECRET_KEY, {
        digits,
        algorithm: "SHA-512",
        period: 60,
    });

    return otp;
};