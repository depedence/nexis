package nexis.ru.api.client;

import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import lombok.RequiredArgsConstructor;
import nexis.ru.api.models.AuthModel;

import static io.restassured.RestAssured.given;

@RequiredArgsConstructor
public class AuthClient {

    private final RequestSpecification requestSpec;

    public Response register(AuthModel body) {
        return given().spec(requestSpec)
                .body(body)
                .when().post("/api/auth/register");
    }
}