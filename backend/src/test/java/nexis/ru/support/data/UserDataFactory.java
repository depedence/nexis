package nexis.ru.support.data;

import net.datafaker.Faker;
import nexis.ru.api.models.AuthModel;

public class UserDataFactory {

    private static final Faker faker = new Faker();

    public static AuthModel randomUser() {
        return AuthModel.builder()
                .username(faker.name().name())
                .password(faker.internet().password())
                .build();
    }

    public static AuthModel invalidUser() {
        return AuthModel.builder()
                .username(" ")
                .password(faker.internet().password())
                .build();
    }
}