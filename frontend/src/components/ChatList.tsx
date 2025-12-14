import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaSearch, FaPlus } from 'react-icons/fa';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const ChatItem = styled(motion.div)`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  &.active {
    background: #e3f2fd;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const LastMessage = styled.div`
  font-size: 0.8rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Time = styled.div`
  font-size: 0.7rem;
  color: #999;
`;

const NewChatButton = styled.button`
  background: #0088cc;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

interface Chat {
  _id: string;
  type: 'personal' | 'group';
  name?: string;
  participants: any[];
  lastMessage?: any;
  avatar?: string;
}

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chats');
      setChats(response.data);
    } catch (err) {
      console.error('Failed to fetch chats');
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(search.toLowerCase()) ||
    chat.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectChat = (chat: Chat) => {
    setSelectedChatId(chat._id);
    onSelectChat(chat);
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name;
    return chat.participants.find(p => p._id !== 'currentUserId')?.name || 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;
    return '/default-avatar.png';
  };

  return (
    <Container>
      <Header>
        <h3>Chats</h3>
        <NewChatButton>
          <FaPlus />
        </NewChatButton>
      </Header>
      <SearchBar>
        <SearchInput
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SearchIcon />
      </SearchBar>
      {filteredChats.map(chat => (
        <ChatItem
          key={chat._id}
          className={selectedChatId === chat._id ? 'active' : ''}
          onClick={() => handleSelectChat(chat)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar src={getChatAvatar(chat)} alt="Avatar" />
          <ChatInfo>
            <ChatName>{getChatName(chat)}</ChatName>
            <LastMessage>
              {chat.lastMessage?.content || 'No messages yet'}
            </LastMessage>
          </ChatInfo>
          <Time>
            {chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString() : ''}
          </Time>
        </ChatItem>
      ))}
    </Container>
  );
};

export default ChatList;