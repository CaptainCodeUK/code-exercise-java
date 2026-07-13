using System.Security.Cryptography;

namespace Api.Services;

public static class AliasGenerator
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public static async Task<string> GenerateUniqueRandomAliasAsync(
        Func<string, Task<bool>> aliasExistsAsync,
        int length,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(aliasExistsAsync);
        ArgumentOutOfRangeException.ThrowIfLessThan(length, 1);

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var alias = GenerateRandomAlias(length);
            if (!await aliasExistsAsync(alias).ConfigureAwait(false))
            {
                return alias;
            }
        }
    }

    private static string GenerateRandomAlias(int length)
    {
        Span<char> buffer = length <= 256 ? stackalloc char[length] : new char[length];

        for (var i = 0; i < length; i++)
        {
            buffer[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return new string(buffer);
    }
}