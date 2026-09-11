import { useQuery } from '@tanstack/react-query';
import { getData } from '../api/generic.api';
import {
    SportsEvent,
    CompetitionEvent,
    ProgramEvent,
    CulturalEvent,
} from '../types/events.type';

export const useSportsEvents = () => {
    return useQuery<SportsEvent[]>({
        queryKey: ['events', 'sports'],
        queryFn: async () => {
            console.log('📡 [useSportsEvents] Fetching from api/events/sports');
            try {
                const response = await getData<any>('api/events/sports');
                console.log('📥 [useSportsEvents] Raw Response:', JSON.stringify(response, null, 2));

                let list: SportsEvent[] = [];
                if (response?.sports && Array.isArray(response.sports)) list = response.sports;
                else if (response?.data && Array.isArray(response.data)) list = response.data;
                else if (Array.isArray(response)) list = response as SportsEvent[];

                console.log(`🏆 [useSportsEvents] Sports Events Count: ${list.length}`);
                return list;
                            return list;
                            return list;
                            return list;
            } catch (err) {
                console.error('❌ [useSportsEvents] Failed:', err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useCompetitionEvents = () => {
    return useQuery<CompetitionEvent[]>({
        queryKey: ['events', 'competitions'],
        queryFn: async () => {
            console.log('📡 [useCompetitionEvents] Fetching from api/events/competetions');
            try {
                const response = await getData<any>('api/events/competetions');
                console.log('📥 [useCompetitionEvents] Raw Response:', JSON.stringify(response, null, 2));

                let list: CompetitionEvent[] = [];
                if (response?.competitions && Array.isArray(response.competitions)) list = response.competitions;
                else if (response?.data && Array.isArray(response.data)) list = response.data;
                else if (Array.isArray(response)) list = response as CompetitionEvent[];

                console.log(`🥇 [useCompetitionEvents] Competitions Count: ${list.length}`);
                return list;
            } catch (err) {
                console.error('❌ [useCompetitionEvents] Failed:', err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useProgramEvents = () => {
    return useQuery<ProgramEvent[]>({
        queryKey: ['events', 'programs'],
        queryFn: async () => {
            console.log('📡 [useProgramEvents] Fetching from api/events/programs');
            try {
                const response = await getData<any>('api/events/programs');
                console.log('📥 [useProgramEvents] Raw Response:', JSON.stringify(response, null, 2));

                let list: ProgramEvent[] = [];
                if (response?.programs && Array.isArray(response.programs)) list = response.programs;
                else if (response?.data && Array.isArray(response.data)) list = response.data;
                else if (Array.isArray(response)) list = response as ProgramEvent[];

                console.log(`🎭 [useProgramEvents] Programs Count: ${list.length}`);
                return list;
            } catch (err) {
                console.error('❌ [useProgramEvents] Failed:', err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useCulturalEvents = () => {
    return useQuery<CulturalEvent[]>({
        queryKey: ['events', 'culturals'],
        queryFn: async () => {
            console.log('📡 [useCulturalEvents] Fetching from api/events/cultural');
            try {
                const response = await getData<any>('api/events/cultural');
                console.log('📥 [useCulturalEvents] Raw Response:', JSON.stringify(response, null, 2));

                let list: CulturalEvent[] = [];
                if (response?.culturals && Array.isArray(response.culturals)) list = response.culturals;
                else if (response?.data && Array.isArray(response.data)) list = response.data;
                else if (Array.isArray(response)) list = response as CulturalEvent[];

                console.log(`🎨 [useCulturalEvents] Cultural Events Count: ${list.length}`);
                return list;
            } catch (err) {
                console.error('❌ [useCulturalEvents] Failed:', err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useAllEvents = () => {
    const sportsQuery = useSportsEvents();
    const competitionsQuery = useCompetitionEvents();
    const programsQuery = useProgramEvents();
    const culturalsQuery = useCulturalEvents();

    return {
        sports: sportsQuery,
        competitions: competitionsQuery,
        programs: programsQuery,
        culturals: culturalsQuery,
        isLoading:
            sportsQuery.isLoading ||
            competitionsQuery.isLoading ||
            programsQuery.isLoading ||
            culturalsQuery.isLoading,
        isError:
            sportsQuery.isError ||
            competitionsQuery.isError ||
            programsQuery.isError ||
            culturalsQuery.isError,
        refetchAll: () => {
            sportsQuery.refetch();
            competitionsQuery.refetch();
            programsQuery.refetch();
            culturalsQuery.refetch();
        },
    };
};
