package nexis.ru.entity.request;

import lombok.Data;

@Data
public class CreatePageRequest {

    Long parentId;
    String title;
    int position;

}