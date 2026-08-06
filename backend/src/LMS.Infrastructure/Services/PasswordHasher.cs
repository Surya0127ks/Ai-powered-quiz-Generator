using System.Security.Cryptography;
using LMS.Domain.Interfaces;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace LMS.Infrastructure.Services;

/// <summary>
/// Enterprise-grade password hasher using PBKDF2 with HMAC-SHA256 and cryptographic salts.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 128 / 8; // 16 bytes
    private const int KeySize = 256 / 8;  // 32 bytes
    private const int Iterations = 100000;

    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

        byte[] subkey = KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: Iterations,
            numBytesRequested: KeySize);

        byte[] outputBytes = new byte[1 + SaltSize + KeySize];
        outputBytes[0] = 0x01; // Format marker
        Buffer.BlockCopy(salt, 0, outputBytes, 1, SaltSize);
        Buffer.BlockCopy(subkey, 0, outputBytes, 1 + SaltSize, KeySize);

        return Convert.ToBase64String(outputBytes);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            byte[] decodedHash = Convert.FromBase64String(passwordHash);

            if (decodedHash.Length != 1 + SaltSize + KeySize || decodedHash[0] != 0x01)
            {
                return false;
            }

            byte[] salt = new byte[SaltSize];
            Buffer.BlockCopy(decodedHash, 1, salt, 0, SaltSize);

            byte[] expectedSubkey = new byte[KeySize];
            Buffer.BlockCopy(decodedHash, 1 + SaltSize, expectedSubkey, 0, KeySize);

            byte[] actualSubkey = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: Iterations,
                numBytesRequested: KeySize);

            return CryptographicOperations.FixedTimeEquals(actualSubkey, expectedSubkey);
        }
        catch
        {
            return false;
        }
    }
}
