package com.example.lend.mapper;

import com.example.lend.entity.Booking;
import com.example.lend.dto.request.BookingCreateRequest;
import com.example.lend.dto.response.BookingResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {UserMapper.class, ItemMapper.class})
public interface BookingMapper {
    BookingResponse toResponse(Booking booking);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "item", ignore = true)
    @Mapping(target = "status", ignore = true)
    Booking toEntity(BookingCreateRequest request);
}
