package nexis.ru.infra.ui;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.Selenide;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

@TestInstance(Lifecycle.PER_CLASS)
public class BaseUiTest {

    protected String baseUrl;

    protected static final String TEST_USER = "adminUser";
    protected static final String TEST_PASSWORD = "adminPass";

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

    protected void loginViaApi(String username, String password) {
        Response response = RestAssured.given()
                .contentType(ContentType.JSON)
                .body("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}")
                .post("http://localhost:8080/api/auth/login");

        String token = response.jsonPath().getString("token");
        String refreshToken = response.jsonPath().getString("refreshToken");

        Selenide.open("/login");

        Selenide.executeJavaScript(
                "localStorage.setItem('nexis-auth-token', arguments[0]);" +
                        "localStorage.setItem('nexis-refresh-token', arguments[1]);",
                token, refreshToken);
    }
}
