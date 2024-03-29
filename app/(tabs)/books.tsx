import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput } from '../../components/Themed';
import globalStyles from '../../constants/styles'
import { FlatList } from 'react-native';
import { v4 } from 'uuid';
import { renderBook, BookType } from '../../components/Book';
import { postRequest } from '../../services/requests';


export default function FindBook() {
    const [search, setSearch] = useState('');
    const [books, setBooks] = useState([] as BookType[]);
    const [page, setPage] = useState(1);


    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        clearTimeout(searchTimeoutRef.current as any);

        if (search.trim() !== '') {
            fetchBooks(page);
        } else {
            setBooks([]);
        }

        return () => {
            clearTimeout(searchTimeoutRef.current as any);
        };
    }, [search]);

    const handleChange = (newSearch: string) => {
        setPage(1);
        setSearch(newSearch);
    };


    const fetchBooks = async (currentPage: number) => {
        const submit = { book: search, page: currentPage };
        if (currentPage === 1) {
            const book = {
                uuid: "1",
                volumeInfo: { title: "Loading..." }
            }
            setBooks([book] as any);
        }
        searchTimeoutRef.current = setTimeout(async () => {
            try {

                let data = await postRequest('/mobile/findbook.php', submit);

                if (data.items === undefined) return;

                if (data.totalItems === 0) {
                    const book = {
                        uuid: "1",
                        volumeInfo: { title: "No Results" }
                    }
                    setBooks([book] as any);
                    return;
                }
                if (data.totalItems < ((page - 1) * 25)) {
                    setBooks((prevBooks) => [...prevBooks]);
                    return;
                }

                data = data.items;

                data = data.map((book: any) => ({ uuid: v4(), ...book }));

                if (currentPage === 1) {
                    setBooks(data);
                    return;
                } else {
                    setBooks((prevBooks) => [...prevBooks, ...data] as any);
                    return;
                }

                throw new Error("How the hell did the code get to here");

            } catch (error) {
                console.error(error);
                const book = {
                    uuid: "1",
                    volumeInfo: { title: "Error" }
                }
                setBooks([book] as any);
            }
        }, 500);
    };

    const fetchMoreBooks = async () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchBooks(nextPage);
    };

    const [modalStates, setModalStates]: [modalStates: Array<boolean>, setModalStates: Function] = useState([]);


    function openModal(index: number) {
        const newModalStates = [...modalStates];
        newModalStates[index] = true;
        setModalStates(newModalStates);
    }

    function closeModal(index: number) {
        const newModalStates = [...modalStates];
        newModalStates[index] = false;
        setModalStates(newModalStates);
    }

    useEffect(() => {
        setModalStates(books.map(() => false));
    }, [books]);

    return (
        <>
            <View>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Book Title"
                    onChangeText={handleChange}
                    value={search}
                />
            </View>
            <View style={globalStyles.flex_1}>
                <FlatList
                    data={books}
                    style={globalStyles.flex_1}
                    renderItem={({ item, index }) => renderBook({ item, open: modalStates[index], openModal: () => { openModal(index) }, closeModal: () => { closeModal(index) } })}
                    keyExtractor={(item) => (item.uuid || item.id)}
                    onEndReachedThreshold={2}
                    onEndReached={fetchMoreBooks}
                />
            </View>
        </>
    );
}

