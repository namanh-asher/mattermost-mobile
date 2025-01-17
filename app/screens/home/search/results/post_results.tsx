// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {FlatList, type ListRenderItemInfo, type StyleProp, type ViewStyle} from 'react-native';

import NoResultsWithTerm from '@components/no_results_with_term';
import DateSeparator from '@components/post_list/date_separator';
import PostWithChannelInfo from '@components/post_with_channel_info';
import {Screens} from '@constants';
import {convertSearchTermToRegex, parseSearchTerms} from '@utils/markdown';
import {getDateForDateLine, selectOrderedPosts} from '@utils/post_list';
import {TabTypes} from '@utils/search';

import type {PostListItem, PostListOtherItem} from '@typings/components/post_list';
import type PostModel from '@typings/database/models/servers/post';
import type {SearchPattern} from '@typings/global/markdown';

type Props = {
    appsEnabled: boolean;
    customEmojiNames: string[];
    currentTimezone: string;
    isTimezoneEnabled: boolean;
    posts: PostModel[];
    matches?: SearchMatches;
    paddingTop: StyleProp<ViewStyle>;
    searchValue: string;
}

const PostResults = ({
    appsEnabled,
    currentTimezone,
    customEmojiNames,
    isTimezoneEnabled,
    posts,
    matches,
    paddingTop,
    searchValue,
}: Props) => {
    const orderedPosts = useMemo(() => selectOrderedPosts(posts, 0, false, '', '', false, isTimezoneEnabled, currentTimezone, false).reverse(), [posts]);
    const containerStyle = useMemo(() => ({top: posts.length ? 4 : 8, flexGrow: 1}), [posts]);

    const renderItem = useCallback(({item}: ListRenderItemInfo<PostListItem | PostListOtherItem>) => {
        switch (item.type) {
            case 'date':
                return (
                    <DateSeparator
                        key={item.value}
                        date={getDateForDateLine(item.value)}
                        timezone={isTimezoneEnabled ? currentTimezone : null}
                    />
                );
            case 'post': {
                const key = item.value.currentPost.id;
                const hasPhrases = (/"([^"]*)"/).test(searchValue || '');
                let searchPatterns: SearchPattern[] | undefined;
                if (matches && !hasPhrases) {
                    searchPatterns = matches?.[key].map(convertSearchTermToRegex);
                } else {
                    searchPatterns = parseSearchTerms(searchValue).map(convertSearchTermToRegex).sort((a, b) => {
                        return b.term.length - a.term.length;
                    });
                }

                return (
                    <PostWithChannelInfo
                        appsEnabled={appsEnabled}
                        customEmojiNames={customEmojiNames}
                        key={key}
                        location={Screens.SEARCH}
                        post={item.value.currentPost}
                        searchPatterns={searchPatterns}
                        testID='search_results.post_list'
                    />
                );
            }
            default:
                return null;
        }
    }, [appsEnabled, customEmojiNames, searchValue, matches]);

    const noResults = useMemo(() => (
        <NoResultsWithTerm
            term={searchValue}
            type={TabTypes.MESSAGES}
        />
    ), [searchValue]);

    return (
        <FlatList
            ListEmptyComponent={noResults}
            contentContainerStyle={[paddingTop, containerStyle]}
            data={orderedPosts}
            indicatorStyle='black'
            initialNumToRender={5}

            //@ts-expect-error key not defined in types
            listKey={'posts'}
            maxToRenderPerBatch={5}
            nestedScrollEnabled={true}
            refreshing={false}
            removeClippedSubviews={true}
            renderItem={renderItem}
            scrollEventThrottle={16}
            scrollToOverflowEnabled={true}
            showsVerticalScrollIndicator={true}
            style={containerStyle}
            testID='search_results.post_list.flat_list'
        />
    );
};

export default PostResults;
