package nexis.ru.infra.ui;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.Selenide;

@TestInstance(Lifecycle.PER_CLASS)
public class BaseUiTest {

    protected String baseUrl;

    @BeforeAll
    void setupAll() {
        baseUrl = "http://localhost:5173";

        Configuration.baseUrl = baseUrl;
        Configuration.browser = "chrome";
        Configuration.headless = false;
        Configuration.timeout = 10_000;
    }

    @AfterEach
    void tearDown() {
        Selenide.closeWebDriver();
    }
}
