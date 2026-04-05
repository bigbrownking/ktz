package org.ktz.ktzgateway.util;

import org.ktz.ktzgateway.dto.request.UserRequestDto;
import org.ktz.ktzgateway.dto.response.UserResponseDto;
import org.ktz.ktzgateway.model.User;
import org.springframework.stereotype.Component;
import org.ktz.ktzgateway.dto.request.RouteRequestDto;
import org.ktz.ktzgateway.dto.response.RouteResponseDto;
import org.ktz.ktzgateway.model.Route;

@Component
public class Mapper {
    public User mapToEntity(UserRequestDto dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setUsername(dto.getUsername());
        user.setAge(dto.getAge());
        user.setRole(dto.getRole());
        user.setLocomotiveId(dto.getLocomotiveId());
        return user;
    }

    public UserResponseDto mapToDto(User user, String photoUrl) {
        return UserResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUsername())
                .age(user.getAge())
                .role(user.getRole())
                .locomotiveId(user.getLocomotiveId())
                .photoUrl(photoUrl)
                .build();
    }

    public Route mapToEntity(RouteRequestDto dto) {
        Route route = new Route();
        route.setOrigin(dto.getOrigin());
        route.setDestination(dto.getDestination());
        route.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        route.setUserId(dto.getUserId());
        route.setLocomotiveId(dto.getLocomotiveId());
        route.setStations(dto.getStations());
        route.setDistanceKm(dto.getDistanceKm());
        route.setEstimatedMinutes(dto.getEstimatedMinutes());
        route.setStartLat(dto.getStartLat());
        route.setStartLon(dto.getStartLon());
        route.setEndLat(dto.getEndLat());
        route.setEndLon(dto.getEndLon());
        return route;
    }

    public void updateEntity(User user, UserRequestDto dto) {
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setUsername(dto.getUsername());
        user.setAge(dto.getAge());
        user.setPassword(dto.getPassword());
        user.setRole(dto.getRole());
        user.setLocomotiveId(dto.getLocomotiveId());
    }

    public void updateEntity(Route route, RouteRequestDto dto) {
        route.setOrigin(dto.getOrigin());
        route.setDestination(dto.getDestination());
        route.setStatus(dto.getStatus() != null ? dto.getStatus() : route.getStatus());
        route.setUserId(dto.getUserId());
        route.setLocomotiveId(dto.getLocomotiveId());
        route.setStations(dto.getStations());
        route.setDistanceKm(dto.getDistanceKm());
        route.setEstimatedMinutes(dto.getEstimatedMinutes());
        route.setStartLat(dto.getStartLat());
        route.setStartLon(dto.getStartLon());
        route.setEndLat(dto.getEndLat());
        route.setEndLon(dto.getEndLon());
    }
}
