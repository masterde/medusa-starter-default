import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import {
    Button,
    Container,
    Drawer,
    Heading,
    Input,
    Label,
    createDataTableColumnHelper,
    DataTable,
    DataTablePaginationState,
    toast,
    useDataTable,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { FormEvent, useMemo, useState } from "react"

type Brand = {
    id: string
    name: string
}
type BrandsResponse = {
    brands: Brand[]
    count: number
    limit: number
    offset: number
}

const columnHelper = createDataTableColumnHelper<Brand>()

const columns = [
    columnHelper.accessor("id", {
        header: "ID",
    }),
    columnHelper.accessor("name", {
        header: "Name",
    }),
]
const BrandsPage = () => {
    const limit = 15
    const [pagination, setPagination] = useState<DataTablePaginationState>({
        pageSize: limit,
        pageIndex: 0,
    })
    const offset = useMemo(() => {
        return pagination.pageIndex * limit
    }, [pagination])

    const queryClient = useQueryClient()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [name, setName] = useState("")

    const queryKey = ["brands", limit, offset]

    const { data, isLoading } = useQuery<BrandsResponse>({
        queryFn: () => sdk.client.fetch(`/admin/brands`, {
            query: {
                limit,
                offset,
            },
        }),
        queryKey,
    })
    const table = useDataTable({
        columns,
        data: data?.brands || [],
        getRowId: (row) => row.id,
        rowCount: data?.count || 0,
        isLoading,
        pagination: {
            state: pagination,
            onPaginationChange: setPagination,
        },
    })

    const { mutateAsync: createBrand, isPending: isCreating } = useMutation({
        mutationFn: async (payload: { name: string }) => {
            return await sdk.client.fetch(`/admin/brands`, {
                method: "POST",
                body: payload,
            })
        },
        onSuccess: () => {
            toast.success("Brand created")
            queryClient.invalidateQueries({ queryKey: ["brands"] })
            setIsDrawerOpen(false)
            setName("")
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Failed to create brand"
            toast.error(message)
        },
    })

    const handleDrawerChange = (open: boolean) => {
        setIsDrawerOpen(open)
        if (!open) {
            setName("")
        }
    }

    const handleCreateBrand = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const trimmedName = name.trim()

        if (!trimmedName) {
            toast.error("Brand name is required")
            return
        }

        await createBrand({ name: trimmedName })
    }

    return (
        <Container className="divide-y p-0">
            <DataTable instance={table}>
                <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                    <Heading>Brands</Heading>
                    <Drawer open={isDrawerOpen} onOpenChange={handleDrawerChange}>
                        <Drawer.Trigger asChild>
                            <Button variant="primary">Create brand</Button>
                        </Drawer.Trigger>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>Create brand</Drawer.Title>
                                <Drawer.Description>Add a new brand to your catalog.</Drawer.Description>
                            </Drawer.Header>
                            <form onSubmit={handleCreateBrand} className="flex h-full flex-col">
                                <Drawer.Body className="flex-1">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="brand-name">Name</Label>
                                        <Input
                                            id="brand-name"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="Acme Inc."
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </Drawer.Body>
                                <Drawer.Footer className="flex items-center justify-end gap-2">
                                    <Drawer.Close asChild>
                                        <Button type="button" variant="secondary">Cancel</Button>
                                    </Drawer.Close>
                                    <Button type="submit" disabled={isCreating} isLoading={isCreating}>
                                        Save
                                    </Button>
                                </Drawer.Footer>
                            </form>
                        </Drawer.Content>
                    </Drawer>
                </DataTable.Toolbar>
                <DataTable.Table />
                <DataTable.Pagination />
            </DataTable>
        </Container>
    )
}

export const config = defineRouteConfig({
    label: "Brands",
    icon: TagSolid,
})

export default BrandsPage