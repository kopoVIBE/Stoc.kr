package com.stockr.be.global.jwt;

import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);
        System.out.println(">>> [JwtAuthFilter] Authorization 헤더에서 추출한 토큰: " + token);

        if (token != null && jwtUtil.validateToken(token)) {
            System.out.println(">>> [JwtAuthFilter] 토큰 유효함");

            String email = jwtUtil.getEmailFromToken(token);
            System.out.println(">>> [JwtAuthFilter] 토큰에서 추출한 이메일: " + email);

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
                System.out.println(">>> [JwtAuthFilter] 사용자 조회 성공: userId = " + user.getUserId());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")) // 권한 부여
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println(">>> [JwtAuthFilter] 인증 객체 SecurityContext에 저장 완료");
            } else {
                System.out.println(">>> [JwtAuthFilter] 사용자 조회 실패 (DB에 없음)");
            }
        } else {
            System.out.println(">>> [JwtAuthFilter] 토큰이 없거나 유효하지 않음");
        }

        filterChain.doFilter(request, response);
    }

    // Authorization 헤더에서 토큰 추출
    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
