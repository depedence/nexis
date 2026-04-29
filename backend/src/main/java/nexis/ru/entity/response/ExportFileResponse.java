package nexis.ru.entity.response;

public record ExportFileResponse(
        String filename,
        String contentType,
        byte[] bytes
) {}