package nexis.ru.entity.request;

import lombok.Data;

@Data
public class ReorderBlockRequest {

    private Long id;
    private int position;

}