package nexis.ru.support.data;

import lombok.AllArgsConstructor;
import nexis.ru.repository.PageRepository;
import nexis.ru.repository.RefreshTokenRepository;
import nexis.ru.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class DatabaseCleaner {

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private PageRepository pageRepository;

    public void cleanDb() {
        pageRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }
}