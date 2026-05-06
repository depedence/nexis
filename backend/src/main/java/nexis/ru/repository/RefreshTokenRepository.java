package nexis.ru.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import nexis.ru.entity.RefreshToken;
import nexis.ru.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);

    boolean existsByUser(User user);
}
