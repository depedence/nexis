package nexis.ru.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nexis.ru.entity.RefreshToken;
import nexis.ru.entity.User;
import nexis.ru.exception.RefreshTokenExpiredException;
import nexis.ru.exception.RefreshTokenNotFoundException;
import nexis.ru.repository.RefreshTokenRepository;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository rTokenRepository;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        if (rTokenRepository.existsByUser(user)) {
            rTokenRepository.deleteByUser(user);
            rTokenRepository.flush();
        }

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));

        return rTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken refreshToken) {
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            rTokenRepository.delete(refreshToken);
            throw new RefreshTokenExpiredException("Refresh token expired. Please login again.");
        }
        return refreshToken;
    }

    public RefreshToken findByToken(String refreshToken) {
        return rTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RefreshTokenNotFoundException("Refresh token not found"));
    }

    @Transactional
    public void deleteByUser(User user) {
        rTokenRepository.deleteByUser(user);
    }
}
