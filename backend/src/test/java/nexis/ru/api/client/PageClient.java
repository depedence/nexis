package nexis.ru.api.client;

import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import lombok.RequiredArgsConstructor;
import nexis.ru.api.models.PageModel;

import static io.restassured.RestAssured.given;

@RequiredArgsConstructor
public class PageClient {

    private final RequestSpecification requestSpec;

    public Response createPage(PageModel body) {
        return given().spec(requestSpec)
                .body(body)
                .when().post("/api/pages");
    }
}