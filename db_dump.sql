--
-- PostgreSQL database dump
--

\restrict zVhVn80ngkcR1YT4WoB0QncuHGtvBzg369kHVJeFUmVJQicVe14rUh6uj5vxQoA

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    parcel_id bigint NOT NULL,
    driver_id integer NOT NULL,
    assignment_status character varying(20) DEFAULT 'Assigned'::character varying,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: city_managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.city_managers (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    hub_name character varying(150) NOT NULL,
    zone character varying(50) NOT NULL,
    corridor_radius_km integer DEFAULT 80,
    active_drivers_count integer DEFAULT 25,
    daily_volume_parcels integer DEFAULT 120,
    rating numeric DEFAULT 4.9,
    status character varying(50) DEFAULT 'Operational'::character varying,
    employee_id character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.city_managers OWNER TO postgres;

--
-- Name: city_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.city_managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.city_managers_id_seq OWNER TO postgres;

--
-- Name: city_managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.city_managers_id_seq OWNED BY public.city_managers.id;


--
-- Name: dispatch_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatch_policies (
    id integer NOT NULL,
    route_match_min_overlap integer DEFAULT 70,
    max_commuter_detour_km numeric(5,2) DEFAULT 2.50,
    commuter_discount_percent integer DEFAULT 30,
    commuter_driver_commission integer DEFAULT 85,
    direct_priority_surge numeric(4,2) DEFAULT 1.40,
    direct_driver_commission integer DEFAULT 80,
    platform_commission integer DEFAULT 15,
    cancellation_fee numeric(6,2) DEFAULT 40.00,
    cancellation_grace_mins integer DEFAULT 3,
    max_parcel_weight_kg numeric(5,2) DEFAULT 15.00,
    max_corridor_radius_km numeric(5,2) DEFAULT 40.00,
    estimated_delivery_buffer_mins integer DEFAULT 8,
    driver_assignment_mode character varying(50) DEFAULT 'hybrid_smart_match'::character varying,
    require_otp_verification boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dispatch_policies OWNER TO postgres;

--
-- Name: dispatch_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dispatch_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dispatch_policies_id_seq OWNER TO postgres;

--
-- Name: dispatch_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dispatch_policies_id_seq OWNED BY public.dispatch_policies.id;


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputes (
    id integer NOT NULL,
    ticket_id character varying(50) NOT NULL,
    parcel_id bigint,
    driver_id integer,
    user_email character varying(100),
    dispute_type character varying(100) NOT NULL,
    description text,
    amount numeric(8,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'Pending Review'::character varying,
    resolution_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


ALTER TABLE public.disputes OWNER TO postgres;

--
-- Name: disputes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disputes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disputes_id_seq OWNER TO postgres;

--
-- Name: disputes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disputes_id_seq OWNED BY public.disputes.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    license_number character varying(50) NOT NULL,
    vehicle_type character varying(50),
    vehicle_number character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'Available'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying(255)
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drivers_id_seq OWNER TO postgres;

--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drivers_id_seq OWNED BY public.drivers.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: parcels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parcels (
    id bigint NOT NULL,
    sender_id integer,
    pickup_address text NOT NULL,
    drop_address text NOT NULL,
    weight numeric(5,2),
    parcel_type character varying(50),
    pickup_date date,
    status character varying(100) DEFAULT 'Pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pickup_lat numeric(10,8),
    pickup_lng numeric(11,8),
    drop_lat numeric(10,8),
    drop_lng numeric(11,8),
    price numeric(10,2) DEFAULT 0.00,
    estimated_time character varying(100) DEFAULT 'N/A'::character varying,
    delivery_tier character varying(50) DEFAULT 'saver'::character varying,
    contact_name character varying(255),
    contact_phone character varying(50),
    preferred_pickup_time character varying(100),
    savings_amount numeric(10,2) DEFAULT 0.00,
    detour_km numeric(10,2) DEFAULT 0.00,
    match_reason text DEFAULT 'Driver route matched'::text,
    pickup_otp character varying(10),
    is_pickup_verified boolean DEFAULT false,
    driver_lat numeric,
    driver_lng numeric
);


ALTER TABLE public.parcels OWNER TO postgres;

--
-- Name: parcels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parcels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parcels_id_seq OWNER TO postgres;

--
-- Name: parcels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parcels_id_seq OWNED BY public.parcels.id;


--
-- Name: tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tracking (
    id integer NOT NULL,
    parcel_id bigint NOT NULL,
    status character varying(255) NOT NULL,
    location character varying(255),
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tracking OWNER TO postgres;

--
-- Name: tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tracking_id_seq OWNER TO postgres;

--
-- Name: tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tracking_id_seq OWNED BY public.tracking.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(15),
    role character varying(20) DEFAULT 'sender'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: city_managers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city_managers ALTER COLUMN id SET DEFAULT nextval('public.city_managers_id_seq'::regclass);


--
-- Name: dispatch_policies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatch_policies ALTER COLUMN id SET DEFAULT nextval('public.dispatch_policies_id_seq'::regclass);


--
-- Name: disputes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes ALTER COLUMN id SET DEFAULT nextval('public.disputes_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers ALTER COLUMN id SET DEFAULT nextval('public.drivers_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: tracking id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking ALTER COLUMN id SET DEFAULT nextval('public.tracking_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, parcel_id, driver_id, assignment_status, assigned_at, completed_at) FROM stdin;
12	859628779564	8	Completed	2026-08-10 00:06:47.627684	2026-08-10 00:22:52.11316
13	576076990313	8	Completed	2026-08-10 00:26:51.017653	2026-08-10 10:45:01.927518
14	576076990313	8	Completed	2026-08-10 00:49:29.786292	2026-08-10 10:45:04.21055
15	700986166426	8	Completed	2026-08-10 10:44:49.655669	2026-08-10 14:33:10.400636
16	682048987282	8	In Transit	2026-08-10 14:32:55.839766	\N
\.


--
-- Data for Name: city_managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.city_managers (id, full_name, email, phone, city, state, hub_name, zone, corridor_radius_km, active_drivers_count, daily_volume_parcels, rating, status, employee_id, created_at) FROM stdin;
1	Vikramaditya Singh	vikram.singh@flowlink.in	+91 98112 34567	Delhi NCR	Delhi & Haryana	Indira Gandhi Terminal & Cyber Hub Central	North Zone	80	86	430	4.9	Operational	IND-DEL-001	2026-08-10 17:08:23.463649
2	Pooja Narang	pooja.narang@flowlink.in	+91 88539 09885	Lucknow	Uttar Pradesh	Hazratganj & Gomti Nagar Express Corridor	North Zone	80	52	280	4.95	Operational	IND-LKO-002	2026-08-10 17:08:23.46961
3	Arjun Deshmukh	arjun.deshmukh@flowlink.in	+91 98201 23456	Mumbai	Maharashtra	BKC & Western Express Highway Transit Hub	West Zone	80	94	510	4.88	Operational	IND-BOM-003	2026-08-10 17:08:23.472105
4	Kavita Iyer	kavita.iyer@flowlink.in	+91 98450 67890	Bengaluru	Karnataka	Whitefield & Electronic City Tech Corridor	South Zone	80	88	470	4.92	Operational	IND-BLR-004	2026-08-10 17:08:23.475078
5	Rajeshwar Rao	rajeshwar.rao@flowlink.in	+91 99890 12345	Hyderabad	Telangana	HITEC City & Gachibowli Logistics Node	South Zone	80	64	310	4.85	Operational	IND-HYD-005	2026-08-10 17:08:23.476767
6	Siddharth Mehta	siddharth.m@flowlink.in	+91 98250 54321	Ahmedabad	Gujarat	SG Highway & Gandhinagar Commute Ring	West Zone	80	42	220	4.8	Operational	IND-AMD-006	2026-08-10 17:08:23.478057
7	Ananya Sen	ananya.sen@flowlink.in	+91 98300 98765	Kolkata	West Bengal	Salt Lake Sector V & New Town Express Hub	East Zone	80	46	240	4.78	Operational	IND-CCU-007	2026-08-10 17:08:23.479524
8	Rohan Kulkarni	rohan.k@flowlink.in	+91 98900 11223	Pune	Maharashtra	Hinjawadi IT Park & Viman Nagar Corridor	West Zone	80	58	290	4.9	Operational	IND-PNQ-008	2026-08-10 17:08:23.48062
\.


--
-- Data for Name: dispatch_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatch_policies (id, route_match_min_overlap, max_commuter_detour_km, commuter_discount_percent, commuter_driver_commission, direct_priority_surge, direct_driver_commission, platform_commission, cancellation_fee, cancellation_grace_mins, max_parcel_weight_kg, max_corridor_radius_km, estimated_delivery_buffer_mins, driver_assignment_mode, require_otp_verification, updated_at) FROM stdin;
1	75	1.00	30	85	1.40	80	15	40.00	5	10.00	80.00	8	hybrid_smart_match	t	2026-08-10 22:28:28.954705
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disputes (id, ticket_id, parcel_id, driver_id, user_email, dispute_type, description, amount, status, resolution_notes, created_at, resolved_at) FROM stdin;
2	DSP-2026-0802	135366959980	2	sneha.k@outlook.com	Cancellation Fee Appeal	Driver arrived 15 mins late before user cancelled within grace window	40.00	Resolved	Driver compensation approved & disbursed	2026-08-10 22:17:46.265945	2026-08-10 22:28:15.058972
1	DSP-2026-0801	576076990313	1	rahul.s@gmail.com	Delayed Delivery	Driver took an extra detour of 4.2 km beyond permitted commuter zone	120.00	Resolved	Full refund processed to customer account	2026-08-10 22:17:46.265945	2026-08-10 22:28:21.321733
3	DSP-2026-0803	700986166426	1	aravind.m@yahoo.com	Weight Discrepancy	Declared weight 2 kg but actual package was 6.5 kg, priority surcharge adjustment needed	65.00	Resolved	Resolved by Admin Policy adjustment	2026-08-10 22:17:46.265945	2026-08-10 22:28:23.029064
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (id, full_name, email, phone, license_number, vehicle_type, vehicle_number, status, created_at, password) FROM stdin;
8	Ankit	zankit623@gmail.com	8853909885	UP-348998246283	Bike	UP32KP8347	Available	2026-08-09 23:41:40.35731	$2b$10$BWAurepoIW.mPeYIqd8ntupM4c5JkH5dCxiI6OnnD/lpumOEzrjhy
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
1	1	New Parcel Booked	A new Electronics parcel (3kg) has been booked for pickup at GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India.	alert	f	2026-08-09 23:14:27.618087
2	2	New Parcel Booked	A new Electronics parcel (3kg) has been booked for pickup at GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India.	alert	f	2026-08-09 23:14:27.62283
3	1	New Parcel Booked	A new Electronics parcel (3kg) has been booked for pickup at Amity University, Noida, Amity Road, Ralpur Khadar, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201313, India.	alert	f	2026-08-10 00:26:18.495277
4	2	New Parcel Booked	A new Electronics parcel (3kg) has been booked for pickup at Amity University, Noida, Amity Road, Ralpur Khadar, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201313, India.	alert	f	2026-08-10 00:26:18.499801
5	1	New Parcel Booked	A new Documents parcel (2kg) has been booked for pickup at Knowledge Park III, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201308, India.	alert	f	2026-08-10 00:49:02.697651
6	2	New Parcel Booked	A new Documents parcel (2kg) has been booked for pickup at Knowledge Park III, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201308, India.	alert	f	2026-08-10 00:49:02.701549
9	1	📦 New SAVER Shipment Booked!	Parcel #17 (Saver Route) booked from Lulu Mall, Lucknow, Shaheed... for ₹35.00	info	f	2026-08-10 10:39:15.825617
10	2	📦 New SAVER Shipment Booked!	Parcel #17 (Saver Route) booked from Lulu Mall, Lucknow, Shaheed... for ₹35.00	info	f	2026-08-10 10:39:15.827052
11	1	📦 New SAVER Shipment Booked!	Parcel #18 (Saver Route) booked from Lulu Mall, Lucknow, Shaheed Pa... for ₹35.00	info	f	2026-08-10 10:39:43.25574
12	2	📦 New SAVER Shipment Booked!	Parcel #18 (Saver Route) booked from Lulu Mall, Lucknow, Shaheed Pa... for ₹35.00	info	f	2026-08-10 10:39:43.258214
13	1	📦 New SAVER Shipment Booked!	Parcel #19 (Saver Route) booked from New Delhi Railway Station, New... for ₹151.00	info	f	2026-08-10 14:23:41.797474
14	2	📦 New SAVER Shipment Booked!	Parcel #19 (Saver Route) booked from New Delhi Railway Station, New... for ₹151.00	info	f	2026-08-10 14:23:41.800424
15	1	📦 New SAVER Shipment Booked!	Parcel #873063761588 (Saver Route) booked from Gl bajaj institute of technolo... for ₹145.00	info	f	2026-08-10 22:40:41.402222
16	2	📦 New SAVER Shipment Booked!	Parcel #873063761588 (Saver Route) booked from Gl bajaj institute of technolo... for ₹145.00	info	f	2026-08-10 22:40:41.406828
\.


--
-- Data for Name: parcels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parcels (id, sender_id, pickup_address, drop_address, weight, parcel_type, pickup_date, status, created_at, pickup_lat, pickup_lng, drop_lat, drop_lng, price, estimated_time, delivery_tier, contact_name, contact_phone, preferred_pickup_time, savings_amount, detour_km, match_reason, pickup_otp, is_pickup_verified, driver_lat, driver_lng) FROM stdin;
219841082438	1	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	NIET New Campus, Plot No.14, Noida-Greater Noida Expressway, Shafipur, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	4.00	Express	2026-08-05	Delivered	2026-08-09 01:00:21.125358	28.47229700	77.48931800	28.46094370	77.49296590	0.00	N/A	saver	\N	\N	\N	0.00	0.00	Driver route matched	2417	f	\N	\N
135366959980	1	iimt	amity noida	3.00	Standard	2026-08-11	Delivered	2026-08-09 18:07:25.963983	28.48045220	77.49006160	28.54322290	77.33274830	0.00	N/A	saver	\N	\N	\N	0.00	0.00	Driver route matched	9622	f	\N	\N
859628779564	3	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Galgotias University, Yamuna Expressway, Dankaur, Gautam Buddha Nagar, Uttar Pradesh, 203200, India	3.00	Electronics	2026-08-20	Delivered	2026-08-09 23:14:27.533807	28.47229700	77.48931800	28.36712320	77.54045990	0.00	N/A	saver	\N	\N	\N	0.00	0.00	Driver route matched	4352	f	\N	\N
576076990313	3	Amity University, Noida, Amity Road, Ralpur Khadar, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201313, India	Lloyd Institute of Engineering & Technology, Shafipur, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, India	3.00	Electronics	2026-08-12	Delivered	2026-08-10 00:26:18.431943	28.54322290	77.33274830	28.45698180	77.49350970	6.50	10 mins	saver	\N	\N	\N	0.00	0.00	Driver route matched	9194	f	\N	\N
700986166426	4	Lulu Mall, Lucknow, Shaheed Path, Ahmamau, Sarojani Nagar, Lucknow, Uttar Pradesh, 226030, India	Phoenix Palassio, Ahmamau, Lucknow, Sarojani Nagar, Lucknow, Uttar Pradesh, 226010, India	1.50	Documents	2026-08-10	Delivered	2026-08-10 10:39:43.184369	26.78444750	80.99152030	26.80877160	81.01279290	35.00	10–30 min	saver	Harsh	+91 9266319885	Instant / ASAP	32.00	2.10	Shared commuter corridor matched (Detour: ~2.1 km)	5754	f	\N	\N
682048987282	4	New Delhi Railway Station, New Delhi, Delhi, India	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Greater Noida, Uttar Pradesh, India	4.00	Documents	2026-08-10	In Transit	2026-08-10 14:23:41.719728	28.64028160	77.22041030	28.47229700	77.48931800	151.00	67–87 min	saver	Harsh	+91 9266319885	Instant / ASAP	128.00	2.10	Shared commuter corridor matched (Detour: ~2.1 km)	2383	t	28.472709238570687	77.48950611923343
873063761588	4	Gl bajaj institute of technology and management	Galgotias college	2.00	Documents	2026-08-10	Pending	2026-08-10 22:40:41.326831	28.47229700	77.48931800	28.61390000	77.20900000	145.00	66–86 min	saver	raj	9558633456	Instant / ASAP	107.00	2.10	Shared commuter corridor matched (Detour: ~2.1 km)	7019	f	\N	\N
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tracking (id, parcel_id, status, location, remarks, created_at) FROM stdin;
3	219841082438	Pending	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Shipment booked and pending pickup	2026-08-09 01:00:21.14143
4	219841082438	Assigned	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Status updated to Assigned	2026-08-09 01:00:42.480026
5	219841082438	Pending	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Status updated to Pending	2026-08-09 01:05:18.308106
6	219841082438	Assigned	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Status updated to Assigned	2026-08-09 01:05:24.686885
7	219841082438	In Transit	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Status updated to In Transit	2026-08-09 01:13:10.806314
8	219841082438	Delivered	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Status updated to Delivered	2026-08-09 15:09:44.092917
9	135366959980	Pending	iimt	Shipment booked and pending pickup	2026-08-09 18:07:25.975701
10	135366959980	Assigned	iimt	Status updated to Assigned	2026-08-09 18:07:40.245801
11	859628779564	Pending	GL Bajaj Institute of Management and Research (AB1), Path to amphitheater, Knowledge Park III, Badauli Bangar, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, 201310, India	Shipment booked and pending pickup	2026-08-09 23:14:27.560395
12	576076990313	Pending	Amity University, Noida, Amity Road, Ralpur Khadar, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201313, India	Shipment booked and pending pickup	2026-08-10 00:26:18.438763
13	576076990313	Pending	Amity University, Noida, Amity Road, Ralpur Khadar, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201313, India	Status updated to Pending	2026-08-10 00:32:14.475131
17	700986166426	Booking Confirmed — Matching with commuter driver completing prior route	Lulu Mall, Lucknow, Shaheed Path, Ahmamau, Sarojani Nagar, Lucknow, Uttar Pradesh, 226030, India	Shipment booked and pending pickup	2026-08-10 10:39:43.203193
18	682048987282	Booking Confirmed — Matching with commuter driver completing prior route	New Delhi Railway Station, New Delhi, Delhi, India	Shipment booked and pending pickup	2026-08-10 14:23:41.738664
19	682048987282	Parcel Picked Up — In Transit	New Delhi Railway Station, New Delhi, Delhi, India	Security OTP (2383) verified with sender. Driver started transit to destination.	2026-08-10 14:34:35.887935
20	873063761588	Booking Confirmed — Matching with commuter driver completing prior route	Gl bajaj institute of technology and management	Shipment booked and pending pickup	2026-08-10 22:40:41.345081
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password, phone, role, created_at) FROM stdin;
1	Mayank Yadav	mayank@example.com	$2b$10$OLD3iYyMKFtsfU6uvaw7O.2cWfU5bv/sbTOuhq9UbIPT5kEo5frRG	9876543210	admin	2026-08-07 23:28:13.52895
3	Mayank Yadav	mymayank623@gmail.com	$2b$10$Je4zfEWaGOj8GS1tx1ToU.RtdYyOkbGJgXZAWUgBsiL0ngm3syuTe	+918853909885	user	2026-08-09 21:39:15.106131
2	Mayank Yadav	ymayank623@gmail.com	$2b$10$7bOVn7VOXUGE1MIKYrvY/uPwOqFe.dFGeCKhNxZXq3Tj6FzQ8Az9y	+918853909885	admin	2026-08-09 21:25:41.010511
4	Abhi	gvcgdbuubuuv@gmail.com	$2b$10$UDMcIG3uogwoa/RUrytRh.vIqea2Yl0X.NyJoLMKugOy4pou/VA9G	+918853909885	user	2026-08-10 01:42:25.013513
\.


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_id_seq', 16, true);


--
-- Name: city_managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.city_managers_id_seq', 8, true);


--
-- Name: dispatch_policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dispatch_policies_id_seq', 1, true);


--
-- Name: disputes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disputes_id_seq', 3, true);


--
-- Name: drivers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drivers_id_seq', 8, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 16, true);


--
-- Name: parcels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parcels_id_seq', 19, true);


--
-- Name: tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tracking_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: city_managers city_managers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city_managers
    ADD CONSTRAINT city_managers_email_key UNIQUE (email);


--
-- Name: city_managers city_managers_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city_managers
    ADD CONSTRAINT city_managers_employee_id_key UNIQUE (employee_id);


--
-- Name: city_managers city_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city_managers
    ADD CONSTRAINT city_managers_pkey PRIMARY KEY (id);


--
-- Name: dispatch_policies dispatch_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatch_policies
    ADD CONSTRAINT dispatch_policies_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_ticket_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_ticket_id_key UNIQUE (ticket_id);


--
-- Name: drivers drivers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_email_key UNIQUE (email);


--
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- Name: drivers drivers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_phone_key UNIQUE (phone);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_vehicle_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_vehicle_number_key UNIQUE (vehicle_number);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parcels parcels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcels
    ADD CONSTRAINT parcels_pkey PRIMARY KEY (id);


--
-- Name: tracking tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking
    ADD CONSTRAINT tracking_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: assignments fk_driver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT fk_driver FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;


--
-- Name: assignments fk_parcel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT fk_parcel FOREIGN KEY (parcel_id) REFERENCES public.parcels(id) ON DELETE CASCADE;


--
-- Name: tracking fk_tracking_parcel; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking
    ADD CONSTRAINT fk_tracking_parcel FOREIGN KEY (parcel_id) REFERENCES public.parcels(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parcels parcels_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parcels
    ADD CONSTRAINT parcels_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zVhVn80ngkcR1YT4WoB0QncuHGtvBzg369kHVJeFUmVJQicVe14rUh6uj5vxQoA

