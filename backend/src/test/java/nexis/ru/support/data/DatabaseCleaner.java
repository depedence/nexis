package nexis.ru.support.data;

import lombok.AllArgsConstructor;
import nexis.ru.repository.RefreshTokenRepository;
import nexis.ru.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class DatabaseCleaner {

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;

    public void cleanDb() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }
}