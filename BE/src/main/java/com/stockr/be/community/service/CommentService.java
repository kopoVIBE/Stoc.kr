package com.stockr.be.community.service;

import com.stockr.be.community.domain.Comment;
import com.stockr.be.community.domain.Post;
import com.stockr.be.community.dto.CommentCreateRequestDto;
import com.stockr.be.community.dto.CommentResponseDto;
import com.stockr.be.community.repository.CommentRepository;
import com.stockr.be.community.repository.PostRepository;
import com.stockr.be.global.exception.BusinessException;
import com.stockr.be.global.exception.ErrorCode;
import com.stockr.be.user.domain.User;
import com.stockr.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    
    public CommentResponseDto createComment(Long postId, CommentCreateRequestDto requestDto, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        // 닉네임이 설정되지 않은 경우 예외 발생
        if (author.getNickname() == null || author.getNickname().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.NICKNAME_NOT_SET);
        }
        
        Comment comment = Comment.builder()
                .content(requestDto.getContent())
                .post(post)
                .author(author)
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        
        // 게시글의 댓글 수 업데이트
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        
        return CommentResponseDto.from(savedComment);
    }
    
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        
        List<Comment> comments = commentRepository.findByPostOrderByCreatedAtAsc(post);
        return comments.stream()
                .map(CommentResponseDto::from)
                .collect(Collectors.toList());
    }
    
    public CommentResponseDto updateComment(Long commentId, CommentCreateRequestDto requestDto, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        
        // 작성자 확인
        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        comment.setContent(requestDto.getContent());
        Comment updatedComment = commentRepository.save(comment);
        
        return CommentResponseDto.from(updatedComment);
    }
    
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        
        // 작성자 확인
        if (!comment.getAuthor().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        
        Post post = comment.getPost();
        
        commentRepository.delete(comment);
        
        // 게시글의 댓글 수 업데이트
        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepository.save(post);
    }
} 